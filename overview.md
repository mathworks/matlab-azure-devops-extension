This extension enables you to run MATLAB&reg; scripts, functions, and statements as part of your build pipeline. You also can easily run your MATLAB and Simulink&reg; tests, generate artifacts such as JUnit test results and Cobertura code coverage report, and publish your results to Azure Pipelines. 

To run your pipeline using the MATLAB Azure Pipelines extension, install the extension to your Azure DevOps organization. You are required to set up a computer with MATLAB (R2013b or later) as a [self-hosted agent](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser) and register the agent with Azure Pipelines.

## Usage Examples
When you author your pipeline, the extension provides you with tasks to run MATLAB scripts, functions, and statements or run MATLAB and Simulink tests. 

### Run MATLAB Script
Use the [Run MATLAB Command](#run-matlab-command) task to run MATLAB scripts, functions, and statements tailored to your specific needs. You can use this task to flexibly customize your test run or add a build step to your pipeline. 

For example, in a file named **azure-pipelines.yml** in the root of your repository, author a pipeline to run the commands in a file named **myscript.m**.

```YAML
pool: myPool
steps:
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
``` 

### Run Tests in MATLAB Project
Use the [Run MATLAB Tests](#run-matlab-tests) task to automatically run tests authored using the MATLAB Unit Testing Framework or Simulink Test&trade;. You can use this task to easily generate different types of test artifacts. You can then publish the artifacts to Azure Pipelines. 

For example, author a pipeline to run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) automatically, and then generate a JUnit test results report and a Cobertura code coverage report at specified locations on the build agent. Publish the generated artifacts to Azure Pipelines once tests are executed. (The published artifacts are displayed in the **Tests** and **Code Coverage** tabs in the pipeline summary.)

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

You can prepend your desired MATLAB to the PATH environment variable of the agent. For example, prepend MATLAB R2020a to the path and use it to run your script.

```YAML
pool: myPool
steps:
  - powershell: Write-Host '##vso[task.prependpath]C:\Program Files\MATLAB\R2020a\bin'  # Windows agent
# - bash: echo '##vso[task.prependpath]/usr/local/MATLAB/R2020a/bin'  # Linux agent
  - task: RunMATLABCommand@0
    inputs:
      command: myscript
```

## Tasks
You can access the MATLAB extension tasks and add them to your pipeline when you edit your pipeline in Azure DevOps. 

![azure](https://user-images.githubusercontent.com/48831250/79513971-1c8da400-8013-11ea-919d-541bbc891675.png)

### Run MATLAB Command
Execute a MATLAB script, function, or statement. Specify the task in your pipeline YAML using the `RunMATLABCommand` key.

Argument                  | Description    
------------------------- | --------------- 
`command`                   | (Required) Script, function, or statement to execute. If the value of `command` is the name of a MATLAB script or function, do not specify the file extension. If you specify more than one MATLAB command, use a comma or semicolon to separate the commands.<br/>**Example:** `'myscript'`<br/>**Example:** `'results = runtests, assertSuccess(results);'` 

MATLAB exits with exit code 0 if the the specified script, function, or statement executes successfully without error. Otherwise, MATLAB terminates with a non-zero exit code, which causes the build to fail. You can use the [`assert`](https://www.mathworks.com/help/matlab/ref/assert.html) or [`error`](https://www.mathworks.com/help/matlab/ref/error.html) functions in the command to ensure that builds fail when necessary.

When you use this task, all of the required files must be on the MATLAB search path.

### Run MATLAB Tests
Run all tests in a MATLAB project and generate test artifacts. Specify the task in your pipeline YAML using the `RunMATLABTests` key.

Argument                  | Description    
------------------------- | --------------- 
`testResultsJunit`        | (Optional) Path to write test results report using the JUnit XML format.
`codeCoverageCobertura`   | (Optional) Path to write code coverage report using the Cobertura XML format.
`sourceFolder`      | (Optional) Location of the folder containing source code, relative to the project root folder. The specified folder and its subfolders will be added to the top of the MATLAB search path. To generate a code coverage report, MATLAB uses only the source code in the specified folder and its subfolders. You can specify multiple folders using a colon-separated or a semicolon-separated list.

MATLAB includes any files in your project that have a **Test** label. If your pipeline does not leverage a MATLAB project or uses a MATLAB release before R2019a, then MATLAB includes all tests in the the root of your repository including its subfolders.


## Contact Us
If you have any questions or suggestions, please contact MathWorks.

continuous-integration@mathworks.com
