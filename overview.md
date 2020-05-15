This extension enables you to run MATLAB&reg; scripts, functions, and statements as part of your build pipeline. You also can run your MATLAB and Simulink&reg; tests, generate artifacts such as JUnit test results and Cobertura code coverage reports, and publish your results to Azure Pipelines. 

To run your pipeline using the extension, install the extension to your Azure DevOps organization. You can use the extension with self-hosted or Linux&reg;-based Microsoft&reg;-hosted [agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser):

- If you want to use a self-hosted agent, you must set up a computer with MATLAB (R2013b or later) as your self-hosted agent and register the agent with Azure Pipelines.

- If you want to use a Microsoft-hosted agent, you must include a task in your pipeline to install the latest MATLAB release on the agent. You can use this task only for public projects that utilize Microsoft-hosted agents.

## Usage Examples
When you author your pipeline, the extension provides you with a task to run MATLAB scripts, functions, and statements. The extension also provides a task to run MATLAB and Simulink tests. Additionally, you can specify a Microsoft-hosted agent to run your MATLAB code.

### Run MATLAB Script
Use the [Run MATLAB Command](#run-matlab-command) task to run MATLAB scripts, functions, and statements tailored to your specific needs. You can use this task to flexibly customize your test run or add a build step to your pipeline. 

For example, in a file named `azure-pipelines.yml` in the root of your repository, author a pipeline to run the commands in a file named `myscript.m`.

```YAML
pool: myPool
steps:
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
``` 

### Run Tests in MATLAB Project
Use the [Run MATLAB Tests](#run-matlab-tests) task to automatically run tests authored using the MATLAB Unit Testing Framework or Simulink Test&trade;. You can use this task to generate different types of test artifacts. You can then publish the artifacts to Azure Pipelines. 

For example, author a pipeline to run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) automatically, and then generate a JUnit test results report and a Cobertura code coverage report at specified locations on the build agent. Use tasks to publish the generated artifacts to Azure Pipelines once the tests are executed. (The published artifacts are displayed in the **Tests** and **Code Coverage** tabs in the pipeline summary.)

```YAML
pool: myPool
steps:
  - task: RunMATLABTests@0
    inputs:
      testResultsJUnit: test-results/results.xml
      codeCoverageCobertura: code-coverage/coverage.xml
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFiles: test-results/results.xml
  - task: PublishCodeCoverageResults@1
    inputs:
      codeCoverageTool: Cobertura
      summaryFileLocation: code-coverage/coverage.xml
``` 

### Specify MATLAB in Pipeline
When you use the **Run MATLAB Command** or **Run MATLAB Tests** tasks in your pipeline, the self-hosted agent uses the first MATLAB instance it encounters on the path. The job fails if the operating system cannot find MATLAB on the path.

You can prepend your desired instance of MATLAB to the PATH environment variable of the agent. For example, prepend MATLAB R2020a to the path and use it to run your script.

```YAML
pool: myPool
steps:
  - powershell: Write-Host '##vso[task.prependpath]C:\Program Files\MATLAB\R2020a\bin'  # Windows agent
# - bash: echo '##vso[task.prependpath]/usr/local/MATLAB/R2020a/bin'  # Linux agent
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
```

### Use MATLAB on Microsoft-Hosted Agent
Use the [Install MATLAB](#install-matlab) task when you want to run MATLAB code in public projects that utilize Microsoft-hosted agents. The task installs the latest MATLAB release on a Linux virtual machine and enables the agent to run MATLAB scripts, functions, statements, and tests.


Use this task in conjunction with the **Run MATLAB Command** or **Run MATLAB Tests** tasks. For example, set up a Microsoft-hosted agent and use it to run the commands in your MATLAB script.

```YAML
pool:
  vmImage: Ubuntu 16.04
steps:
  - task: InstallMATLAB@0
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
```

## Tasks
You can access the extension tasks and add them to your pipeline when you edit your pipeline in Azure DevOps. 

![azure](https://user-images.githubusercontent.com/48831250/81958519-1ff95880-95dc-11ea-8318-a99308107476.png)

### Run MATLAB Command
Execute a MATLAB script, function, or statement. Specify the task in your pipeline YAML using the `RunMATLABCommand` key.

Argument                  | Description    
------------------------- | --------------- 
`command`                   | (Required) Script, function, or statement to execute. If the value of `command` is the name of a MATLAB script or function, do not specify the file extension. If you specify more than one MATLAB command, use a comma or semicolon to separate the commands.<br/>**Example:** `'myscript'`<br/>**Example:** `'results = runtests, assertSuccess(results);'` 

MATLAB exits with exit code 0 if the specified script, function, or statement executes successfully without error. Otherwise, MATLAB terminates with a nonzero exit code, which causes the build to fail. You can use the [`assert`](https://www.mathworks.com/help/matlab/ref/assert.html) or [`error`](https://www.mathworks.com/help/matlab/ref/error.html) functions in the command to ensure that builds fail when necessary.

When you use this task, all of the required files must be on the MATLAB search path.

### Run MATLAB Tests
Run all tests in a MATLAB project and generate test artifacts. Specify the task in your pipeline YAML using the `RunMATLABTests` key.

Argument                  | Description    
------------------------- | --------------- 
`testResultsJunit`        | (Optional) Path to write test results report in JUnit XML format.<br/>**Example:** `'test-results/results.xml'`
`codeCoverageCobertura`   | (Optional) Path to write code coverage report in Cobertura XML format.<br/>**Example:** `'code-coverage/coverage.xml'`
`sourceFolder`      | (Optional) Location of the folder containing source code, relative to the project root folder. The specified folder and its subfolders are added to the top of the MATLAB search path. To generate a code coverage report, MATLAB uses only the source code in the specified folder and its subfolders. You can specify multiple folders using a colon-separated or a semicolon-separated list.<br/>**Example:** `'source'`

MATLAB includes any files in your project that have a **Test** label. If your pipeline does not leverage a MATLAB project or uses a MATLAB release before R2019a, then MATLAB includes all tests in the the root of your repository including its subfolders.

### Install MATLAB
Install the latest MATLAB release on a Linux-based Microsoft-hosted agent. Specify the task in your pipeline YAML using the `InstallMATLAB` key.

You can use this task only for public projects that utilize Microsoft-hosted agents.

## Contact Us
If you have any questions or suggestions, please contact MathWorks&reg; at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
